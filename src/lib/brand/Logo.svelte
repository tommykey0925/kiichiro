<!--
	文字ロゴ。「.」を蜂の巣の六角形に置き換えて見せる。読み上げは「kiichi.ro」のまま。
	手書きのロゴに替えるときはこの部品の中身だけを替える。
-->
<span class="logo">kiichi<span class="sr-only">.</span><span class="dot" aria-hidden="true"></span>ro</span>

<style>
	.logo {
		font-family: var(--font-sign-title);
		font-weight: 700;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}

	.dot {
		display: inline-block;
		width: 0.34em;
		height: 0.38em;
		margin: 0 0.04em;
		background: var(--honey);
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
