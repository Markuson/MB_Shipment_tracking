import Form from 'next/form';
import { Button } from '@/components/ui/button';
import type { Site } from '@/domain/shipment';

type SiteFilterFormProps = {
  sites: Site[];
  selectedSiteId: string | undefined;
};

// The filter lives in the URL and works without JavaScript. With it, submitting is a client-side
// navigation, so the demo clock and injected events survive a change of filter.
export function SiteFilterForm({ sites, selectedSiteId }: SiteFilterFormProps) {
  return (
    <Form action="/ops" className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="site-filter" className="text-label">Site</label>
        <select
          id="site-filter"
          name="site"
          defaultValue={selectedSiteId ?? ''}
          className="h-10 rounded border border-input bg-surface px-3 text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <option value="">All sites</option>
          {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
        </select>
      </div>
      <Button type="submit" variant="secondary" className="h-10">Apply</Button>
    </Form>
  );
}
