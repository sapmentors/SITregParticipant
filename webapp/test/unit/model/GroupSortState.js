sap.ui.define([
		"com/sap/sapmentors/sitreg/registration/model/GroupSortState",
		"sap/ui/model/json/JSONModel"
	], function (GroupSortState, JSONModel) {
	"use strict";

	QUnit.module("GroupSortState - grouping and sorting", {
		beforeEach: function () {
			this.oModel = new JSONModel({});
			// System under test
			this.oGroupSortState = new GroupSortState(this.oModel, function() {});
		}
	});

	QUnit.test("Should always return a sorter when sorting", function (assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.sort("MaxParticipants").length, 1, "The sorting by MaxParticipants returned a sorter");
		assert.strictEqual(this.oGroupSortState.sort("Location").length, 1, "The sorting by Location returned a sorter");
	});

	QUnit.test("Should return a grouper when grouping", function (assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.group("MaxParticipants").length, 1, "The group by MaxParticipants returned a sorter");
		assert.strictEqual(this.oGroupSortState.group("None").length, 0, "The sorting by None returned no sorter");
	});


	QUnit.test("Should set the sorting to MaxParticipants if the user groupes by MaxParticipants", function (assert) {
		// Act + Assert
		this.oGroupSortState.group("MaxParticipants");
		assert.strictEqual(this.oModel.getProperty("/sortBy"), "MaxParticipants", "The sorting is the same as the grouping");
	});

	QUnit.test("Should set the grouping to None if the user sorts by Location and there was a grouping before", function (assert) {
		// Arrange
		this.oModel.setProperty("/groupBy", "MaxParticipants");

		this.oGroupSortState.sort("Location");

		// Assert
		assert.strictEqual(this.oModel.getProperty("/groupBy"), "None", "The grouping got reset");
	});
});
