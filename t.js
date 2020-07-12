Object.defineProperty(Number.prototype, "s", {
  get() {
    return this * 1e3;
  },
});
Object.defineProperty(Number.prototype, "m", {
  get() {
    return this * 60;
  },
});
console.log((1)["s"], (1)["s"].m);
