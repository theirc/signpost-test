import { useRouter } from 'next/router';
import React, { useContext } from 'react';

import { ServiceContext } from '../../context/context';

function ServicePage() {
  const { services } = useContext(ServiceContext);
  const router = useRouter();
  const { id } = router.query;

  console.log(services);
  const selectedService = services.find(
    (services) => services.id === Number(id)
  );
  console.log(selectedService);
  return (
    <div>
      {selectedService ? (
        <>
          <h1>{selectedService.name}</h1>
          {/* <p>{selectedService.description}</p> */}
        </>
      ) : (
        <p>No service found with the provided ID</p>
      )}
    </div>
  );
}

export default ServicePage;
