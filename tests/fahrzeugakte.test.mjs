import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SourceTextModule, SyntheticModule } from "node:vm";
import mongoose from "mongoose";

test("the vehicle list loads and searches linked buyers on a fresh server", async (t) => {
  const db = new mongoose.Mongoose();
  const modules = new Map();
  const mocks = {
    mongoose: { default: db },
    "@/lib/mongodb": { connectDB: async () => {} },
    "@/lib/kaufvertragServer": {
      staffUser: async () => ({ userId: "test-staff" }),
      errorResponse: (err) => { throw err; },
    },
  };

  function load(name) {
    if (modules.has(name)) return modules.get(name);
    const exports = mocks[name];
    const mod = exports
      ? new SyntheticModule(Object.keys(exports), function () {
          for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
        })
      : new SourceTextModule(readFileSync(new URL(`../${name.slice(2)}.js`, import.meta.url), "utf8"), { identifier: name });
    modules.set(name, mod);
    return mod;
  }

  const route = load("@/app/api/fahrzeugakte/route");
  await route.link(load);
  await route.evaluate();

  const buyerId = new mongoose.Types.ObjectId();
  const sold = { _id: new mongoose.Types.ObjectId(), carName: "Testwagen", finNumber: "TESTVIN1234567890", stage: "SOLD", soldContactId: buyerId };
  const workshop = { _id: new mongoose.Types.ObjectId(), carName: "Werkstattwagen", stage: "WERKSTATT" };
  const mockFind = (model, docs) => {
    t.mock.method(model.collection, "find", async () => ({ toArray: async () => docs.map((doc) => ({ ...doc })) }));
  };
  mockFind(db.models.CarSchein, [sold, workshop]);
  for (const name of ["Car", "Kaufvertrag", "PrivateContract"]) mockFind(db.models[name], []);
  // Leave an unregistered model untouched so Mongoose can report the real error.
  if (db.models.ContactCustomer) mockFind(db.models.ContactCustomer, [{ _id: buyerId, customerName: "Testkunde" }]);

  const url = "http://localhost/api/fahrzeugakte";
  const res = await route.namespace.GET(new Request(url));
  assert.equal(res.status, 200);
  const { vehicles, counts } = await res.json();
  assert.equal(vehicles.length, 2);
  assert.equal(vehicles.find((v) => v.phase === "verkauft").sale.buyerName, "Testkunde");
  assert.equal(counts.verkauft, 1);

  const search = await route.namespace.GET(new Request(`${url}?phase=verkauft&q=Testkunde`));
  assert.equal(search.status, 200);
  assert.deepEqual((await search.json()).vehicles.map((v) => v._id), [String(sold._id)]);
});
