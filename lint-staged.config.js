module.exports = {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write", "npm run check-types"],
  "*.{md,json}": "prettier --write",
};
