import { error } from '@sveltejs/kit';
import { works } from '$lib/works';

export const entries = () => works.map(({ id }) => ({ id }));

export const load = ({ params }) => {
	const work = works.find((w) => w.id === params.id);
	if (!work) error(404, `unknown work: ${params.id}`);
	return { work };
};
