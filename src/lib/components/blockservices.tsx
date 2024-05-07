import { app, translate } from "../app"
import { Container } from "./container"
import { Loader } from "./loader"
import { Maps } from "./map"
import { Tabs } from "antd"
import type { TabsProps } from "antd"
import { ServicesList } from "./services"
import React, { useCallback, useEffect, useState } from "react"
import TreeSelect, { MenuItem } from "./tree-select"
import { useMultiState } from "./hooks"
import ReactGA from "react-ga4";

enum filterType {
  serviceTypes = "serviceTypes",
  provider = "provider",
  populations = "populations",
  accessibility = "accessibility",
}

export function BlockServices(props: { block: BlockServices }) {
  const { block } = props

  const {
    state: { servicesLoaded },
  } = app
  const [selectedFilterValues, setSelectedFilterValues] = useState({
    serviceTypes: [[-1]],
    provider: [[-1]],
    populations: [[-1]],
    accessibility: [[-1]],
  })
  const services = Object.values(app.data.services).filter(
    (x) => x.status !== "archived"
  )
  ReactGA.initialize('G-31W3P2WWYQ')

  const uniqueProvidersSet = new Set(services.flatMap((x) => x.provider))
  const providers =
    Object.values(app.data.categories.providers)
      .filter((x) => Array.from(uniqueProvidersSet).includes(x.id))
      .sort((a, b) =>
        translate(a.name)
          .normalize()
          .localeCompare(translate(b.name).normalize())
      ) || []

  const usedCategoryIdsSet = new Set<number>();
  const usedSubcategoryIds = new Set<number>();
  services.forEach((service) => {
    service.subcategories.forEach((subcategory) => {
      usedSubcategoryIds.add(subcategory);
    });
    service.categories.forEach((category) => {
      usedCategoryIdsSet.add(category);
    });
  });
  const categories = Object.values(app.data.categories.categories || []).filter(
    (category) => usedCategoryIdsSet.has(category.id)
  );
  const subcategories = Object.values(
    app.data.categories.subCategories || []
  ).filter((subcat) => usedSubcategoryIds.has(subcat.id));

  const [state, setState] = useMultiState({
    filteredServices: services,
    filteredProviders: providers,
  })

  const accessibilities = Object.values(app.data.categories.accesibility) || []
  const populations = Object.values(app.data.categories.populations) || []

  const items: TabsProps["items"] = [
    {
      key: "map",
      label: "Map View",
      children: <Maps services={state.filteredServices} />,
    },
    {
      key: "list",
      label: "List View",
      children: <ServicesList services={state.filteredServices} />,
    },
  ]

  const combineCategoriesWithSubcategories = (categories, subcategories) => {
    const combinedData = categories.map((category) => {
      const subcategoriesForCategory = subcategories
        .filter((subcategory) => subcategory.parent.includes(category.id))
        .map((subcategory) => ({
          value: subcategory.id,
          label: translate(subcategory.name),
        }));
      return {
        value: category.id,
        label: translate(category.name),
        children: subcategoriesForCategory,
      };
    });
    combinedData.unshift({ value: -1, label: "All services types" });
    return combinedData;
  };

  const mapProviderData = (providers: Provider[]): MenuItem[] => {
    const filterProviders = providers.map((x) => {
      return {
        value: x.id,
        label: translate(x.name),
      };
    });
    filterProviders.unshift({ value: -1, label: "All providers" });
    return filterProviders;
  };

  const filterFirstSubArray = (arrayOfArrays: number[][]): number[][] => {
    const firstSubArray = arrayOfArrays[0]

    const filteredFirstSubArray = firstSubArray.filter((num) => num !== -1)

    return [filteredFirstSubArray, ...arrayOfArrays.slice(1)]
  }

  const handleSelectedFilters = (value: number[][], filter: filterType) => {
    if (!value.length || value.flat()[value.flat().length - 1] === -1) {
      setSelectedFilterValues((prevValues) => ({
        ...prevValues,
        [filter]: [[-1]],
      }));
    } else {
      setSelectedFilterValues((prevValues) => ({
        ...prevValues,
        [filter]: filterFirstSubArray(value),
      }))
    }
  }

  const handleProviderChange = useCallback(
    (value: number[][], services2: Service[]) => {
      if (!value.length || value.flat()[value.flat().length - 1] === -1) {
        return services
      }

      const providerIDs = new Set(value.flat());
      services2 = services2.filter(
        (x) => !!x.provider && providerIDs.has(x?.provider)
      )

      return services2
    },
    []
  )

  const handleAccessibilityChange = useCallback(
    (value: number[][], services: Service[]) => {
      if (!value.length || value.flat()[value.flat().length - 1] === -1)
        return services

      const accessibilityIDs = new Set(value.flat())
      services = services.filter((x) => {
        return (
          x.Accessibility &&
          x.Accessibility.some((a) => accessibilityIDs.has(a))
        )
      })
      return services
    },
    []
  )

  const handlePopulationsChange = useCallback(
    (value: number[][], services: Service[]) => {
      if (!value.length || value.flat()[value.flat().length - 1] === -1)
        return services

      const populationsId = new Set(value.flat())
      services = services.filter((x) => {
        return x.Populations && x.Populations.some((a) => populationsId.has(a))
      })
      return services
    },
    []
  )

  const handleServiceTypeChange = useCallback(
    (value: number[][], services: Service[]) => {
      const categoryMap = new Map<number, boolean>();
      const subcategoryMap = new Map<number, boolean>();

      if (!value.length || value.flat()[value.flat().length - 1] === -1) {
        filterProviders(services);
        return services;
      }

      for (const criteria of value) {
        const [categoryId, ...subcategoryIds] = criteria;
        for (const subcategoryId of subcategoryIds) {
          subcategoryMap.set(subcategoryId, true);
        }
        if (!subcategoryMap.size) {
          categoryMap.set(categoryId, true);
        }
      }

      services = services.filter((data) => {
        return (
          data.categories.some((category) => categoryMap.has(category)) ||
          data.subcategories.some((subcategory) =>
            subcategoryMap.has(subcategory)
          )
        );
      });
      filterProviders(services);

      let gtvalues = []
      const categoryArray = Array.from(categoryMap)
      const subcategoryArray = Array.from(subcategoryMap);

      for (let category of categoryArray) {
        console.log('AAA ', category[0]);
        gtvalues.push(translate(categories.find(x => x.id === category[0])?.name))
      }
      for (let subcat of subcategoryArray) {
        gtvalues.push(translate(subcategories.find(x => x.id === subcat[0])?.name))
      }

      ReactGA.event('dropdownChanged', {
        category: 'TreeSelect',
        action: 'Service Type Change',
        label: gtvalues,
        fieldValue: gtvalues,
      });

      return services;
    },
    []
  );

  const filterProviders = (services: Service[]) => {
    const uniqueProvidersIdsSet = new Set(services.flatMap((x) => x.provider));
    const uniqueProvidersArray = providers
      ?.filter((x) => Array.from(uniqueProvidersIdsSet).includes(x.id))
      .sort((a, b) =>
        translate(a.name)
          .normalize()
          .localeCompare(translate(b.name).normalize())
      );

    setState({ filteredProviders: uniqueProvidersArray });
  };

  const handleDropdownVisibleChange = (open: boolean) => {
    if (open === false) {
      Object.entries(selectedFilterValues).forEach(([key, value]) => {
        if (
          key === filterType.serviceTypes &&
          JSON.stringify(value) === JSON.stringify([[-1]])
        ) {
          filterProviders(services);
        }
      });
    }
  };

  useEffect(() => {
    let filteredData = [...services];

    Object.entries(selectedFilterValues).forEach(([key, value]) => {
      if (
        key === filterType.provider &&
        JSON.stringify(value) !== JSON.stringify([[-1]])
      ) {
        filteredData = handleProviderChange(value, filteredData)
      } else if (
        key === filterType.accessibility &&
        JSON.stringify(value) !== JSON.stringify([[-1]])
      ) {
        filteredData = handleAccessibilityChange(value, filteredData)
      } else if (
        key === filterType.populations &&
        JSON.stringify(value) !== JSON.stringify([[-1]])
      ) {
        filteredData = handlePopulationsChange(value, filteredData)
      } else if (
        key === filterType.serviceTypes &&
        JSON.stringify(value) !== JSON.stringify([[-1]])
      ) {
        filteredData = handleServiceTypeChange(value, filteredData);
      }
    })

    setState({ filteredServices: filteredData })
  }, [selectedFilterValues, app.data.services])

  useEffect(() => {
    setState({
      filteredServices: services,
    })
  }, [app.data.services, app.data.categories.providers])

  return (
    <Container block={block} className="transition-all">
      <div className="text-4xl">{translate(props.block.title)}</div>
      <div className="text-2xl mt-4 opacity-50">
        {translate(props.block.subtitle)}
      </div>
      <div className="flex">
        <TreeSelect
          label="Service Types"
          items={combineCategoriesWithSubcategories(categories, subcategories)}
          className="w-full overflow-hidden px-2 sm:w-1/2 mt-4 service-types-select"
          onChange={(value) =>
            handleSelectedFilters(value, filterType.serviceTypes)
          }
          onClear={() => filterProviders(services)}
          onDropdownVisibleChange={handleDropdownVisibleChange}
          value={selectedFilterValues.serviceTypes}
          defaultValue={[[-1]]}
        />
        <TreeSelect
          label="Provider"
          items={mapProviderData(state.filteredProviders)}
          className="w-full overflow-hidden px-2 sm:w-1/2 mt-4"
          onChange={(value) => {
            handleSelectedFilters(value, filterType.provider)
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
  )
}
