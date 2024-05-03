import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

// This route is called when the user visits /dashboard/[organization]/chatbots/[chatbot]
// We redirect to /dashboard/[organization]/chatbots/[chatbot]/[document]
export function GET(req: NextRequest) {
  return redirect(req.nextUrl.pathname + '/documents');
}