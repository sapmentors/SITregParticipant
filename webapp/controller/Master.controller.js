/*global history */
sap.ui.define([
	"com/sap/sapmentors/sitreg/registration/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"com/sap/sapmentors/sitreg/registration/model/formatter",
	"com/sap/sapmentors/sitreg/registration/model/grouper",
	"com/sap/sapmentors/sitreg/registration/model/GroupSortState",
	"sap/m/MessageBox"
], function(BaseController, JSONModel, Filter, FilterOperator, GroupHeaderListItem, Device, formatter, grouper, GroupSortState, MessageBox) {
	"use strict";

	return BaseController.extend("com.sap.sapmentors.sitreg.registration.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function() {
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oGroupSortStateMaxParticipants = new GroupSortState(
										oViewModel, 
										grouper.groupMaxParticipants(this.getResourceBundle())
									);

			this._oGroupSortStateLocation = new GroupSortState(
										oViewModel,
										grouper.groupLocation(this.getResourceBundle())
									);

			this._oGroupSortStateStartTime = new GroupSortState(
										oViewModel, 
										grouper.groupStartTime(this.getResourceBundle())
									);

			this._oGroupSortStateEventType = new GroupSortState(
										oViewModel, 
										grouper.groupEventType(this.getResourceBundle())
									);

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function() {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
			// hide pull to refresh if necessary
			this.byId("pullToRefresh").hide();
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("Location", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the sorter selection.
		 * @param {sap.ui.base.Event} oEvent the select event
		 * @public
		 */
		onSort: function(oEvent) {
			var sKey = oEvent.getSource().getSelectedItem().getKey();
			var aSorters = this._getSorterByKey(sKey);

			this._applyGroupSort(aSorters);
		},

		/**
		 * Event handler for the grouper selection.
		 * @param {sap.ui.base.Event} oEvent the search field event
		 * @public
		 */
		onGroup: function(oEvent) {
			var sKey = oEvent.getSource().getSelectedItem().getKey();
			var aSorters = this._getSorterByKey(sKey);

			this._applyGroupSort(aSorters);
		},
		
		/**
		 * Event handler for the filter button to open the ViewSettingsDialog.
		 * which is used to add or remove filters to the master list. This
		 * handler method is also called when the filter bar is pressed,
		 * which is added to the beginning of the master list when a filter is applied.
		 * @public
		 */
		onOpenViewSettings: function() {
			if (!this._oViewSettingsDialog) {
				this._oViewSettingsDialog = sap.ui.xmlfragment("com.sap.sapmentors.sitreg.registration.view.ViewSettingsDialog", this);
				this.getView().addDependent(this._oViewSettingsDialog);
				// forward compact/cozy style into Dialog
				this._oViewSettingsDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}
			this._oViewSettingsDialog.open();
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters
		 * are applied to the master list, which can also mean that the currently
		 * applied filters are removed from the master list, in case the filter
		 * settings are removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog: function(oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				oFilterCompoundKeys = oEvent.getParameters().filterCompoundKeys,
				aFilters = [],
				aCaptions = [];

			// update filter state:
			// combine the filter array and the filter string
			aFilterItems.forEach(function(oItem) {
				if ( oFilterCompoundKeys.MaxParticipants ) {
					switch (oItem.getKey()) {
						case "Filter1":
							aFilters.push(new Filter("MaxParticipants", FilterOperator.LE, 50));
							break;
						case "Filter2":
							aFilters.push(new Filter("MaxParticipants", FilterOperator.GT, 50));
							break;
						default:
							break;
					}
				} else if ( oFilterCompoundKeys.Visible ) {
					aFilters.push(new Filter("Visible", FilterOperator.EQ, oItem.getKey()));
				} else if ( oFilterCompoundKeys.Type ) {
					aFilters.push(new Filter("Type", FilterOperator.EQ, oItem.getKey()));
				}
				aCaptions.push(oItem.getText());
			});

			this._oListFilterState.aFilter = aFilters;
			this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function(oEvent) {
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function() {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},
		
		/**
		 * About Dialog also used for Registration as Organizer
		 * 
		 */
		onAboutRegisterAsOrganizer: function() {
			sap.m.URLHelper.redirect("https://github.com/sapmentors/SITregParticipant/issues/4", true);
			/*
			this.getRouter().navTo("registerAsOrganizer", {}, true);
			this.getRouter().getTargets().display("registerAsOrganizer", {
				mode: "create"
			});
			*/
		},
		
		onMenuAction: function(oEvent) {
			var oItem = oEvent.getParameter("item"),
				sItemPath = "",
				sId = "";
			if (oItem instanceof sap.m.MenuItem) {
				sItemPath = oItem.getText();
				sId = oItem.getId();
			}
			if(sId.endsWith("about")) {
				this.onAbout(oEvent);
			} else if(sId.endsWith("privacy")) {
				sap.m.URLHelper.redirect("https://www.sap.com/about/legal/privacy.html", true);
			} else if(sId.endsWith("legal")) {
				sap.m.URLHelper.redirect("https://www.sap.com/about/legal/impressum.html", true);
			}
		},

		onAbout: function(oEvent) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			this._oLayout = sap.ui.xmlfragment("com.sap.sapmentors.sitreg.registration.view.About", this);
			this.getView().addDependent(this._oLayout);
			
			var arrayAboutButtons = [
					/*
					new sap.m.Button({
						text: this.getResourceBundle().getText("ButtonRequestOrganiserRole"), 
						type: sap.m.ButtonType.Accept,
						press: this.onAboutRegisterAsOrganizer
					}),
					*/
					
					new sap.m.Button({
						text: this.getResourceBundle().getText("ButtonAboutClose"), 
						type: sap.m.ButtonType.Default,
						press: function() {
							oDialog.close();
						}})
					];
			
			var oDialog = new sap.m.Dialog("idAboutBox",{
				title: this.getResourceBundle().getText("aboutDialogTitle"),
				content: this._oLayout,
				buttons: arrayAboutButtons,
				initialFocus: arrayAboutButtons[1], //Focus on Close only Button
				afterClose: function() {
					oDialog.destroy();
				}
			});
			
			oDialog.addStyleClass( bCompact? "sapUiSizeCompact" : "" );

			oDialog.open();

		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_createViewModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "StartTime",
				groupBy: "None"
			});
		},

		_getSorterByKey: function(sKey) {
			var aSorter = [];
			if(sKey === "MaxParticipants") {
				aSorter = this._oGroupSortStateMaxParticipants.group(sKey);
			} else if (sKey === "Location") {
				aSorter = this._oGroupSortStateLocation.group(sKey);
			} else if (sKey === "StartTime") {
				aSorter = this._oGroupSortStateStartTime.group(sKey);
			} else if (sKey === "EventType") {
				aSorter = this._oGroupSortStateEventType.group(sKey);
			}
			return aSorter;
		},

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onMasterMatched: function() {
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function(mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}
					var sObjectId = mParams.firstListitem.getBindingContext().getProperty("ID");
					this.getRouter().navTo("object", {
						objectId: sObjectId
					}, true);
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}.bind(this)
			);
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function(oItem) {
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("ID")
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method to apply both group and sort state together on the list binding
		 * @param {sap.ui.model.Sorter[]} aSorters an array of sorters
		 * @private
		 */
		_applyGroupSort: function(aSorters) {
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function(sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		}

	});

});