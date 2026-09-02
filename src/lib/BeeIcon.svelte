<!-- 配色は bee.glb のマテリアルから取っている。ボタンと世界の蜂を同じものに見せるため。 -->
<svg viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="3D で見る">
	<defs>
		<radialGradient id="bee-body" cx="35%" cy="28%" r="78%">
			<stop offset="0%" stop-color="#ffc46b" />
			<stop offset="45%" stop-color="#ff9800" />
			<stop offset="100%" stop-color="#b35f00" />
		</radialGradient>
		<radialGradient id="bee-head" cx="35%" cy="28%" r="80%">
			<stop offset="0%" stop-color="#5a5a5a" />
			<stop offset="60%" stop-color="#1a1a1a" />
			<stop offset="100%" stop-color="#000" />
		</radialGradient>
		<linearGradient id="bee-wing" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
			<stop offset="100%" stop-color="#80deea" stop-opacity="0.55" />
		</linearGradient>
		<radialGradient id="bee-shadow" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="#23201c" stop-opacity="0.32" />
			<stop offset="100%" stop-color="#23201c" stop-opacity="0" />
		</radialGradient>
		<clipPath id="bee-clip">
			<ellipse cx="34" cy="33" rx="19" ry="13.5" transform="rotate(-14 34 33)" />
		</clipPath>
	</defs>

	<ellipse cx="32" cy="55" rx="17" ry="4.5" fill="url(#bee-shadow)" />

	<g transform="rotate(-14 34 33)">
		<ellipse cx="30" cy="18" rx="13" ry="7" fill="url(#bee-wing)" transform="rotate(-24 30 18)" />
		<ellipse cx="41" cy="20" rx="10" ry="5.5" fill="url(#bee-wing)" transform="rotate(14 41 20)" />
	</g>

	<ellipse cx="34" cy="33" rx="19" ry="13.5" fill="url(#bee-body)" transform="rotate(-14 34 33)" />

	<g clip-path="url(#bee-clip)" fill="#1a1a1a" opacity="0.92">
		<rect x="30" y="12" width="6.5" height="42" transform="rotate(-14 34 33)" />
		<rect x="41" y="12" width="6" height="42" transform="rotate(-14 34 33)" />
	</g>

	<ellipse
		cx="27"
		cy="26"
		rx="7"
		ry="3.4"
		fill="#fff"
		opacity="0.34"
		transform="rotate(-24 27 26)"
	/>

	<g stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round" fill="none">
		<path d="M13 20 q2 -6 7 -7" />
		<path d="M18 16 q4 -5 9 -4" />
	</g>

	<circle cx="17" cy="29" r="9.5" fill="url(#bee-head)" />
	<circle cx="14.5" cy="26" r="2.6" fill="#fff" opacity="0.9" />
	<circle cx="14" cy="26.6" r="1.2" fill="#1a1a1a" />
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
