sap.ui.define([
	], function () {
		"use strict";

		/*
		 * Use this file to implement your custom grouping functions
		 * The predefined functions are simple examples and might be replaced by your more complex implementations
		 * to be called with .bind() and handed over to a sap.ui.model.Sorter
		 * return value for all your functions is an object with  key-text pairs
		 * the oContext parameter is not under your control!
		 */

		return {

			/**
			 * Groups the items by a price in two groups: Lesser equal than 20 and greater than 20
			 * This grouping function needs the resource bundle so we pass it as a dependency
			 * @param oResourceBundle {sap.ui.model.resource.ResourceModel} the resource bundle of your i18n model
			 * @returns {Function} the grouper function you can pass to your sorter
			 */
			groupMaxParticipants : function (oResourceBundle) {
				return function (oContext) {
					var iPrice = oContext.getProperty("MaxParticipants"),
						sKey,
						sText;

					if (iPrice <= 20) {
						sKey = "LE20";
						sText = oResourceBundle.getText("masterGroup1Header1");
					} else {
						sKey = "GT20";
						sText = oResourceBundle.getText("masterGroup1Header2");
					}

					return {
						key: sKey,
						text: sText
					};
				};
			},
			
			groupStartTime : function (oResourceBundle) {
				return function (oContext) {
					var dStartTime = new Date(oContext.getProperty("StartTime")),
						dNow = new Date(),
						sKey,
						sText;

					if (dStartTime <= dNow) {
						sKey = "LENOW";
						sText = oResourceBundle.getText("masterGroup2Header1");
					} else {
						sKey = "GTNOW";
						sText = oResourceBundle.getText("masterGroup2Header2");
					}

					return {
						key: sKey,
						text: sText
					};
				};
			},
			
			groupLocation : function (oResourceBundle) {
				return function (oContext) {
					var sType = oContext.getProperty("Location");
					return {
						key: sType,
						text: sType
					};
				};
			},
			
			groupEventType : function (oResourceBundle) {
				return function (oContext) {
					var sType = oContext.getProperty("Type");
					var sEventType = oContext.getProperty("EventType/Description");
					return {
						key: sType,
						text: sEventType
					};
				};
			}

		};
	}
);