/*global location */
sap.ui.define([
		"com/sap/sapmentors/sitreg/registration/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"com/sap/sapmentors/sitreg/registration/model/formatter",
		"sap/m/library"
	], function (BaseController, JSONModel, formatter, MLibrary) {
		"use strict";
		var URLHelper = MLibrary.URLHelper;

		return BaseController.extend("com.sap.sapmentors.sitreg.registration.controller.Detail", {

			formatter: formatter,
			
			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var oViewModel = new JSONModel({
					busy : false,
					delay : 0,
					lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading")
				});

				this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

				this.setModel(oViewModel, "detailView");

				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */


			handleLinkObjectAttributePress: function (oEvent) {
				URLHelper.redirect("https://www.piacere-nuovo.com", true);
			},

			/**
			 * Event handler when the Export to Calendar button has been clicked
			 */
			onCalendarExport: function(){
				var iId = this.getView().getBindingContext().getProperty("ID");
				// get uri to service 
				var sExportService = this.getOwnerComponent().getManifestEntry("sap.app").dataSources.mainService.uri;
				sExportService = sExportService.replace("service.xsodata/", "ExportCalendar.xsjs?ID=" + iId);
				window.open(sExportService, '_blank');
			},
			
			/**
			 * Event handler when the Register button has been clicked
			 * @param {object} oEvent an event containing the total number of items in the list
			 */
			onRegister: function(oEvent){
				//this.getRouter().navTo("register");
				var sObjectPath = this.getView().getElementBinding().getPath() + "/Participant";
				this.getRouter().getTargets().display("register", {
					mode: "create",
					objectId: this.getView().getBindingContext().getProperty("ID"),
					objectPath: sObjectPath
				});
			
			},
			
			/**
			 * Event handler in case of edit the participant registration.  
			 * @param {object} oEvent contain the selected item
			 * @public
			 */
			onEdit : function (oEvent) {
				
				//this.getModel("appView").setProperty("/addEnabled", false);
				//var table = this.getView().byId("lineItemsList");
				//var rowItems = table.getSelectedItems();
				//var item  = oEvent.getParameter("item");
				//var asnnum = rowItems[0].mAggregations.cells[1].getProperty("ParticipantID");
				
				this.getModel("appView").setProperty("/addEnabled", false);
				var sObjectPath = this.getView().getElementBinding().getPath() + "/Participant";
				this.getRouter().getTargets().display("register", {
					mode: "update",
					objectId: this.getView().getBindingContext().getProperty("ID"),
					objectPath: sObjectPath
				});
			},

			/**
			 * Event handler when the share by E-Mail button has been clicked
			 * @public
			 */
			onShareEmailPress : function () {
				var oViewModel = this.getModel("detailView");

				sap.m.URLHelper.triggerEmail(
					null,
					oViewModel.getProperty("/shareSendEmailSubject"),
					oViewModel.getProperty("/shareSendEmailMessage")
				);
			},

			
			/**
			 * Updates the item count within the line item table's header
			 * @param {object} oEvent an event containing the total number of items in the list
			 * @private
			 */
			onListUpdateFinished : function (oEvent) {
				var sTitle,
					iTotalItems = oEvent.getParameter("total"),
					oViewModel = this.getModel("detailView");

				// only update the counter if the length is final
				if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
					if (iTotalItems) {
						sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
					} else {
						//Display 'Line Items' instead of 'Line items (0)'
						sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
					}
					oViewModel.setProperty("/lineItemListTitle", sTitle);
				}
			},

			/**
			 * Event handler  for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the master route.
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = this.History.getInstance().getPreviousHash();

				if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("master", {}, true);
				}
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */

			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				this.getModel().metadataLoaded().then( function() {
					var sObjectPath = this.getModel().createKey("Events", {
						ID :  sObjectId
					});
					this._bindView("/" + sObjectPath, {expand: "RegistrationNumbers,Participant,Ticket,EventType"} );
				}.bind(this));
			},

			/**
			 * Binds the view to the object path. Makes sure that detail view displays
			 * a busy indicator while data for the corresponding element binding is loaded.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound to the view.
			 * @private
			 */
			_bindView : function (sObjectPath, oParameters) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("detailView");

				// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
				oViewModel.setProperty("/busy", false);

				this.getView().bindElement({
					path : sObjectPath,
					parameters: oParameters,
					events: {
						change : this._onBindingChange.bind(this),
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},

			_onBindingChange : function () {
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("detailObjectNotFound");
					// if object could not be found, the selection in the master list
					// does not make sense anymore.
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
					return;
				}

				var sPath = oElementBinding.getPath(),
					oResourceBundle = this.getResourceBundle(),
					oObject = oView.getModel().getObject(sPath),
					sObjectLocation = oObject.Location,
					sObjectStartTime = oObject.StartTime,
					// sObjectParticipantID = oObject.Participant.ID,
					oViewModel = this.getModel("detailView");

				this.getOwnerComponent().oListSelector.selectAListItem(sPath);

				oViewModel.setProperty("/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectStartTime, sObjectLocation]));
				oViewModel.setProperty("/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectLocation, location.href]));
			},

			_onMetadataLoaded : function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
					oViewModel = this.getModel("detailView"),
					oLineItemTable = this.byId("lineItemsList"),
					iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

				// Make sure busy indicator is displayed immediately when
				// detail view is displayed for the first time
				oViewModel.setProperty("/delay", 0);
				oViewModel.setProperty("/lineItemTableDelay", 0);

				oLineItemTable.attachEventOnce("updateFinished", function() {
					// Restore original busy indicator delay for line item table
					oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
				});

				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			}

		});

	}
);