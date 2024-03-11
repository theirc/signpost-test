import { app, translate } from "../app";
import { Container } from "./container";
import { Loader } from "./loader";
import { Maps } from "./map";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { ServicesList } from "./services";
import React, { useCallback, useEffect, useState } from "react";
import TreeSelect, { MenuItem } from "./tree-select";
import { useMultiState } from "./hooks";

enum filterType {
  serviceTypes = "serviceTypes",
  provider = "provider",
  populations = "populations",
  accessibility = "accessibility",
}

export function BlockServices(props: { block: BlockServices }) {
  const { block } = props;

  const {
    state: { servicesLoaded },
  } = app;
  const [selectedFilterValues, setSelectedFilterValues] = useState({
    serviceTypes: [[-1]],
    provider: [[-1]],
    populations: [[-1]],
    accessibility: [[-1]],
  });
  const services = Object.values(app.services).filter(
    (x) => x.status !== "archived"
  );
  console.log('SERVICES ', services);

  const uniqueProvidersSet = new Set(services.flatMap((x) => x.provider));
  const providers =
    Object.values(app.categories.providers)
      .filter((x) => Array.from(uniqueProvidersSet).includes(x.id))
      .sort((a, b) =>
        translate(a.name)
          .normalize()
          .localeCompare(translate(b.name).normalize())
      ) || [];

  const [state, setState] = useMultiState({
    filteredServices: services,
  });

  const accessibilities = Object.values(app.categories.accesibility) || [];
  const populations = Object.values(app.categories.populations) || [];

  const items: TabsProps["items"] = [
    {
      key: "map",
      label: "Map View",
      children: <Maps services={state.filteredServices} />,
    },
    {
      key: "list",
      label: "List View",
      children: <ServicesList />,
    },
  ];

  const mapProviderData = (): MenuItem[] => {
    console.log("mapProviderData ", providers);
    return providers.map((x) => {
      return {
        value: x.id,
        label: translate(x.name),
      };
    });
  };

  const filterFirstSubArray = (arrayOfArrays: number[][]): number[][] => {
    const firstSubArray = arrayOfArrays[0];

    const filteredFirstSubArray = firstSubArray.filter((num) => num !== -1);

    return [filteredFirstSubArray, ...arrayOfArrays.slice(1)];
  };

  const handleSelectedFilters = (value: number[][], filter: filterType) => {
    if (!value.length || value.flat()[value.flat().length - 1] === -1) {
      setSelectedFilterValues((prevValues) => ({
        ...prevValues,
        [filter]: [[]],
      }));
    } else {
      console.log("111 ", filterFirstSubArray(value));
      setSelectedFilterValues((prevValues) => ({
        ...prevValues,
        [filter]: filterFirstSubArray(value),
      }));
    }
  };

  const handleProviderChange = useCallback(
    (value: number[][], services2: Service[]) => {
      if (!value.length || value.flat()[value.flat().length - 1] === -1) {
        return services;
      }

      const providerIDs = new Set(value.flat());
      console.log("PROVIDERS ", providerIDs);
      services2 = services2.filter(
        (x) => !!x.provider && providerIDs.has(x?.provider)
      );

      return services2;
    },
    []
  );

  const handleAccessibilityChange = useCallback(
    (value: number[][], services: Service[]) => {
      if (!value.length || value.flat()[value.flat().length - 1] === -1)
        return services;

      const accessibilityIDs = new Set(value.flat());
      services = services.filter((x) => {
        return (
          x.Accessibility &&
          x.Accessibility.some((a) => accessibilityIDs.has(a))
        );
      });
      return services;
    },
    []
  );

  const handlePopulationsChange = useCallback(
    (value: number[][], services: Service[]) => {
      if (!value.length || value.flat()[value.flat().length - 1] === -1)
        return services;

      const populationsId = new Set(value.flat());
      services = services.filter((x) => {
        return x.Populations && x.Populations.some((a) => populationsId.has(a));
      });
      return services;
    },
    []
  );

  useEffect(() => {
    let filteredData = [...services];
    console.log("data ", filteredData);
    console.log("tate.filteredServices ", state.filteredServices);
    console.log("selectedFilterValues ", selectedFilterValues);

    Object.entries(selectedFilterValues).forEach(([key, value]) => {
      if (
        key === filterType.provider &&
        JSON.stringify(value) !== JSON.stringify([[-1]])
      ) {
        filteredData = handleProviderChange(value, filteredData);
      } else if (
        key === filterType.accessibility &&
        JSON.stringify(value) !== JSON.stringify([[-1]])
      ) {
        filteredData = handleAccessibilityChange(value, filteredData);
      } else if (
        key === filterType.populations &&
        JSON.stringify(value) !== JSON.stringify([[-1]])
      ) {
        filteredData = handlePopulationsChange(value, filteredData);
      } else if (
        key === filterType.serviceTypes &&
        JSON.stringify(value) !== JSON.stringify([[-1]])
      ) {
        // filteredData = handleServiceTypeChange(value, filteredData); TODO: SERVICE TYPE CHANGE
      }
    });

    console.log("filteredData ", filteredData);
    setState({ filteredServices: filteredData });
  }, [selectedFilterValues, app.services]);

  useEffect(() => {
    console.log("ENTRA ACA ", providers, " ", services);
    setState({
      filteredServices: services,
    });
  }, [app.services, app.categories.providers]);

  return (
    <Container block={block} className="transition-all">
      <div className="text-4xl">{translate(props.block.title)}</div>
      <div className="text-2xl mt-4 opacity-50">
        {translate(props.block.subtitle)}
      </div>
      <div>
        <TreeSelect
          label="Provider"
          items={mapProviderData()}
          className="w-full overflow-hidden px-2 sm:w-1/2 mt-4"
          onChange={(value) => {
            handleSelectedFilters(value, filterType.provider);
          }}
          value={selectedFilterValues.provider}
          defaultValue={[[-1]]}
        />
      </div>
      {servicesLoaded && <Tabs defaultActiveKey="map" items={items} />}
      {!servicesLoaded && (
        <div className="flex items-center justify-center my-16">
          <Loader size={72} width={12} className="bg-gray-500" />
        </div>
      )}
    </Container>
  );
}