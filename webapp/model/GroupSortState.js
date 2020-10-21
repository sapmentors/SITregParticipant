sap.ui.define([
		"sap/ui/base/Object",
		"sap/ui/model/Sorter"
	], function (BaseObject, Sorter) {
	"use strict";

	return BaseObject.extend("com.sap.sapmentors.sitreg.registration.model.GroupSortState", {

		/**
		 * Creates sorters and groupers for the master list.
		 * Since grouping also means sorting, this class modifies the viewmodel.
		 * If a user groups by a field, and there is a corresponding sort option, the option will be chosen.
		 * If a user ungroups, the sorting will be reset to the default sorting.
		 * @class
		 * @public
		 * @param {sap.ui.model.json.JSONModel} oViewModel the model of the current view
		 * @param {function} fnGroupFunction the grouping function to be applied
		 * @alias com.sap.sapmentors.sitreg.registration.model.GroupSortState
		 */
		constructor: function (oViewModel, fnGroupFunction) {
			this._oViewModel = oViewModel;
			this._fnGroupFunction = fnGroupFunction;
		},

		/**
		 * Sorts by Location, or by MaxParticipants
		 *
		 * @param {string} sKey - the key of the field used for grouping
		 * @returns {sap.ui.model.Sorter[]} an array of sorters
		 */
		sort: function (sKey) {
			var sGroupedBy = this._oViewModel.getProperty("/groupBy");

			if (sGroupedBy !== "None") {
				// If the list is grouped, remove the grouping since the user wants to sort by something different
				// Grouping only works if the list is primary sorted by the grouping - the first sorten contains a grouper function
				this._oViewModel.setProperty("/groupBy", "None");
			}

			return [new Sorter(sKey, false)];
		},

		/**
		 * Groups by MaxParticipants, or resets the grouping for the key "None"
		 *
		 * @param {string} sKey - the key of the field used for grouping
		 * @returns {sap.ui.model.Sorter[]} an array of sorters
		 */
		group: function (sKey) {
			var aSorters = [];

			if (sKey === "MaxParticipants") {
				// Grouping means sorting so we set the select to the same Entity used for grouping
				this._oViewModel.setProperty("/sortBy", "MaxParticipants");

				aSorters.push(
					new Sorter("MaxParticipants", false,
						this._fnGroupFunction.bind(this))
				);
			} else if (sKey === "StartTime") {
				// Grouping means sorting so we set the select to the same Entity used for grouping
				this._oViewModel.setProperty("/sortBy", "StartTime");

				aSorters.push(
					new Sorter("StartTime", false,
						this._fnGroupFunction.bind(this))
				);
			} else if (sKey === "EventType") {
				// Grouping means sorting so we set the select to the same Entity used for grouping
				this._oViewModel.setProperty("/sortBy", "EventType");

				aSorters.push(
					new Sorter("Type", false,
						this._fnGroupFunction.bind(this))
				);
			} else if (sKey === "Location") {
				// select the default sorting again
				this._oViewModel.setProperty("/sortBy", "Location");
				aSorters.push(
					new Sorter("Location", false,
						this._fnGroupFunction.bind(this))
				);
			}

			return aSorters;
		}

	});
});