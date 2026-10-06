import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "kiichiro",
		compatibilityDate: "2026-09-02",
		assets: {
			notFoundHandling: "404-page",
		},
	},
});
