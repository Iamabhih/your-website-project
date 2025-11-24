import { useStoreSettings } from '@/hooks/useStoreSettings';

export function PolicyContactInfo() {
  const { data: settings } = useStoreSettings();

  const storeEmail = settings?.store_email || 'support@idealsmokesupply.com';
  const storePhone = settings?.store_phone || 'Contact us via email';
  const storeName = settings?.store_name || 'Ideal Smoke Supply';

  const hasAddress = settings?.store_address || settings?.store_city;
  const fullAddress = hasAddress
    ? [
        settings?.store_address,
        settings?.store_city,
        settings?.store_province,
        settings?.store_postal_code,
        settings?.store_country,
      ].filter(Boolean).join(', ')
    : 'South Africa';

  return (
    <div className="bg-muted p-4 rounded-lg mt-4">
      <p className="text-foreground/90">
        <strong>{storeName}</strong><br />
        <strong>Email:</strong> {storeEmail}<br />
        {storePhone && <><strong>Phone:</strong> {storePhone}<br /></>}
        <strong>Address:</strong> {fullAddress}
      </p>
    </div>
  );
}
