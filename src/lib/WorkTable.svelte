<script lang="ts">
	import { onMount } from 'svelte';
	import type { Work } from './works';
	import './dads/table.css';
	import './dads/link.css';

	let { works }: { works: Work[] } = $props();

	// customElements.define を含むのでクライアントでだけ読む
	onMount(() => {
		import('./dads/scroll-shadow.js');
	});
</script>

<!-- 狭い幅は公式どおり横スクロール + 両端の影。padding は .wrap の左右余白と同じ -->
<dads-scroll-shadow style="--scroll-shadow-padding: 1.25rem;">
	<div class="dads-table" data-size="dense">
		<table class="dads-table__table" data-width="full" data-cell-border="bottom">
			<thead>
				<tr>
					<th class="dads-table__col-header" scope="col">作品</th>
					<th class="dads-table__col-header" scope="col">概要</th>
					<th class="dads-table__col-header" scope="col">技術</th>
					<th class="dads-table__col-header" scope="col">リポジトリ</th>
				</tr>
			</thead>
			<tbody>
				{#each works as work (work.id)}
					<tr>
						<td class="title"><a class="dads-link" href="/works/{work.id}">{work.title}</a></td>
						<td class="summary">{work.summary}</td>
						<td>{work.tech.join(', ')}</td>
						<td class="repo"><a class="dads-link" href={work.repo} rel="noreferrer">GitHub</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</dads-scroll-shadow>

<style>
	/* JS が来る前も横スクロールは効かせる */
	dads-scroll-shadow:not(:defined) {
		display: block;
		overflow-x: auto;
	}

	/* 公式見本 overflow-on-mobile と同じ最小幅 */
	.dads-table__table {
		min-width: 40rem;
	}

	th,
	.title,
	.repo {
		white-space: nowrap;
	}

	.summary {
		min-width: 12rem;
	}
</style>
