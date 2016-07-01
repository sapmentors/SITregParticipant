jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 Events in the list
// * All 3 Events have at least one Participants

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/sap/sapmentors/sitreg/registration/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/sap/sapmentors/sitreg/registration/test/integration/pages/App",
	"com/sap/sapmentors/sitreg/registration/test/integration/pages/Browser",
	"com/sap/sapmentors/sitreg/registration/test/integration/pages/Master",
	"com/sap/sapmentors/sitreg/registration/test/integration/pages/Detail",
	"com/sap/sapmentors/sitreg/registration/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.sap.sapmentors.sitreg.registration.view."
	});

	sap.ui.require([
		"com/sap/sapmentors/sitreg/registration/test/integration/MasterJourney",
		"com/sap/sapmentors/sitreg/registration/test/integration/NavigationJourney",
		"com/sap/sapmentors/sitreg/registration/test/integration/NotFoundJourney",
		"com/sap/sapmentors/sitreg/registration/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});
