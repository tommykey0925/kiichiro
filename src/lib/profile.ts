export const profile = {
	name: 'tommy',
	// TODO: 自己紹介は本人の言葉に差し替える
	bio: {
		ja: 'Web アプリと、その下のインフラを両方作るのが好きです。AWS のサーバーレス構成に Svelte や Go、Rust、PHP を載せて、動くところまで持っていったものを並べています。'
	},
	github: 'https://github.com/tommykey0925',
	// スパム収集を少しだけ面倒にするため、実行時に組み立てる
	emailParts: ['tommykey0925', 'gmail.com'],
	skills: [
		'SvelteKit / Svelte 5',
		'TypeScript',
		'Go',
		'Rust',
		'Java / Spring Boot',
		'Python / FastAPI',
		'PHP / Laravel',
		'AWS (Lambda, DynamoDB, Cognito, S3, CloudFront)',
		'Terraform',
		'GitHub Actions'
	]
} as const;

export const email = () => profile.emailParts.join('@');
