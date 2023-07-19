import { DirectusArticle } from '@ircsignpost/signpost-base/dist/src/directus';
import { SignpostService } from '@ircsignpost/signpost-base/dist/src/service-map-common';
import React from 'react';

export type ServiceType = DirectusArticle | SignpostService;

interface ServiceContextType {
  services: ServiceType[];
  setServices: React.Dispatch<React.SetStateAction<ServiceType[]>>;
}

// Initialize context with an empty array and an empty function
export const ServiceContext = React.createContext<ServiceContextType>({
  services: [],
  setServices: () => {},
});
