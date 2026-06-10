migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const collection = new Collection({
    name: "beacons",
    type: "base",
    fields: [
      {
        name: "owner",
        type: "relation",
        required: true,
        collectionId: users.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      {
        name: "slot",
        type: "number",
        required: true,
        min: 1,
        max: 3,
        noDecimal: true,
      },
      {
        name: "name",
        type: "text",
        required: true,
        min: 1,
        max: 80,
      },
      {
        name: "color",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["cyan", "amber", "moss", "violet", "rose"],
      },
      {
        name: "latitude",
        type: "number",
        required: true,
        min: -90,
        max: 90,
      },
      {
        name: "longitude",
        type: "number",
        required: true,
        min: -180,
        max: 180,
      },
      {
        name: "confidence",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["high", "medium", "low", "unknown"],
      },
      {
        name: "placementHeading",
        type: "number",
        required: false,
        min: 0,
        max: 359.999,
      },
      {
        name: "placementDistanceMeters",
        type: "number",
        required: true,
        min: 0,
      },
      {
        name: "locationAccuracyMeters",
        type: "number",
        required: false,
        min: 0,
      },
      {
        name: "headingAccuracy",
        type: "text",
        required: false,
        max: 80,
      },
      {
        name: "headingStability",
        type: "select",
        required: false,
        maxSelect: 1,
        values: ["stable", "degraded", "unstable", "unknown"],
      },
      {
        name: "deletedAt",
        type: "date",
        required: false,
      },
    ],
    indexes: [
      "CREATE INDEX idx_beacons_owner_deleted ON beacons (owner, deletedAt)",
      "CREATE UNIQUE INDEX idx_beacons_owner_slot_active ON beacons (owner, slot) WHERE deletedAt = ''",
    ],
    listRule: 'owner = @request.auth.id && deletedAt = ""',
    viewRule: "owner = @request.auth.id",
    createRule: '@request.auth.id != "" && owner = @request.auth.id',
    updateRule: "owner = @request.auth.id",
    deleteRule: "owner = @request.auth.id",
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("beacons");
  return app.delete(collection);
});
