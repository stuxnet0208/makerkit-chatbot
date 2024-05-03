import { redirect } from 'next/navigation';

interface Params {
  params: {
    organization: string;
  };
}

export default function Page({ params }: Params) {
  // redirect to chatbots page by default
  return redirect(`${params.organization}/chatbots`);
}
