sap.ui.define([
	], function () {
		"use strict";

		return {
			/**
			 * Rounds the currency value to 2 digits
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} formatted currency value with 2 digits
			 */
			currencyValue : function (sValue) {
				if (!sValue) {
					return "";
				}

				return parseFloat(sValue).toFixed(2);
			},
			/**
			 * Return the Registration Numbers for the Event
			 *
			 * @public
			 * @param {string} Event ID for which the Registration Numbers should be returned
			 * @returns {string} Registration Numbers
			 */
			countParticipants : function (sEventID) {
			    // 
			    if (sEventID) {
			    	var oResourceBundle = this.getModel("i18n").getResourceBundle();
			    	var oModel = this.getView().getModel();
			    	var registeredParticipants = oModel.getProperty("/Events("+sEventID+")/Participants").length;
			    	var maxParticipants = oModel.getProperty("/Events("+sEventID+")/MaxParticipants");
			    	var freeSlots = maxParticipants - registeredParticipants;
			    	return oResourceBundle.getText("masterRegistrationNumbers", [freeSlots, registeredParticipants, maxParticipants]);
			    }
			}
		};

	}
);