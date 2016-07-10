sap.ui.define([
	"com/sap/sapmentors/sitreg/registration/controller/BaseController",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"

], function(BaseController, History, JSONModel, MessageBox) {
	"use strict";

	return BaseController.extend("com.sap.sapmentors.sitreg.registration.controller.CreateEntity", {


		/**
		 * Event handler for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the detail route.
		 * @public
		 */
		onNavBack : function() {

			var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("detail", {}, bReplace);
			}
		}

});

});