import { DirectusArticle } from '@ircsignpost/signpost-base/dist/src/directus';
import { useRouter } from 'next/router';
import React, { useContext } from 'react';

import { ServiceContext } from '../../context/context';

export default function ServicePage() {
  const { services } = useContext(ServiceContext);
  const router = useRouter();

  const { service } = router.query;
  console.log('ID', service);

  console.log('Services:', services);
  const selectedService = services.find(
    (services) => services.id === Number(service)
  );
  console.log('Selected Service', selectedService);
  return (
    <div>
      {selectedService && 'description' in selectedService && (
        <>
          <h1>{selectedService.name}</h1>
          {selectedService.addHours && (
            <div>
              <h2>Opening Hours</h2>
              <ul>
                {selectedService.addHours.map((hour, index) => (
                  <li key={index}>
                    {hour.Day}: {hour.open} - {hour.close}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedService.address && <p>Address: {selectedService.address}</p>}
          {selectedService.contactInfo.map((info, index) => (
            <div key={index}>
              <p>
                {info.channel}: {info.contact_details}
              </p>
            </div>
          ))}
          <div
            dangerouslySetInnerHTML={{
              __html: (selectedService as DirectusArticle).description,
            }}
          ></div>
          <p>Contact Email: {selectedService.contactEmail}</p>
          <p>Contact Phone: {selectedService.contactPhone}</p>
          {selectedService.date_updated && (
            <p>Last Updated: {selectedService.date_updated}</p>
          )}
        </>
      )}
      {!selectedService && <p>No service found with the provided ID</p>}
    </div>
  );
}
