import { app, translate } from "../app";
import { Container } from "./container";
import { Loader } from "./loader";
import { Maps } from "./map";
import { Button, Radio, Space, Tabs } from "antd";
import type { TabsProps } from "antd";
import { ServicesList } from "./services";
import React, { useCallback, useEffect, useState } from "react";
import TreeSelect, { MenuItem } from "./tree-select";
import { useMultiState } from "./hooks";
import ReactGA from "react-ga4";
import { CloseOutlined, FilterOutlined } from "@ant-design/icons";

enum filterType {
  serviceTypes = "serviceTypes",
  provider = "provider",
  populations = "populations",
  accessibility = "accessibility",
}

export function BlockServices(props: { block: BlockServices }) {
  const { block } = props;
  const [filterOpen, setFilterOpen] = useState(false)

  const {
    state: { servicesLoaded },
  } = app;
  const [selectedFilterValues, setSelectedFilterValues] = useState({
    serviceTypes: [-1],
    provider: [-1],
    populations: [-1],
    accessibility: [-1],
  });
  const [lastValue, setLastValue] = useState<number[]>([-1]);
  const [view, setView] = useState<number>(0)

  const services = Object.values(app.data.services).filter(
    (x) => x.status !== "archived"
  );
  ReactGA.initialize("G-H6VQ1Y6EX9");

  const uniqueProvidersSet = new Set(services.flatMap((x) => x.provider));
  const providers =
    Object.values(app.data.categories.providers)
      .filter((x) => Array.from(uniqueProvidersSet).includes(x.id))
      .sort((a, b) =>
        translate(a.name)
          .normalize()
          .localeCompare(translate(b.name).normalize())
      ) || [];

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
  });

  const accessibilities = Object.values(app.data.categories.accesibility) || [];
  const populations = Object.values(app.data.categories.populations) || [];

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

  const filterFirstSubArray = (valuesArray: number[]): number[] => {
    if (valuesArray[0] === -1) {
      return [...valuesArray.slice(1)];
    } else {
      return valuesArray
    }
  };

  const handleSelectedFilters = (value: number[], filter: filterType) => {
    if (!value.length || value.flat()[value.flat().length - 1] === -1) {
      setSelectedFilterValues((prevValues) => ({
        ...prevValues,
        [filter]: [-1],
      }));
    } else {
      let changedValues: number[] = [];
      if (filter === filterType.serviceTypes) {
        let prevValue = { ...selectedFilterValues };

        for (let v of value) {
          if (
            !prevValue.serviceTypes.some(
              (pv) => JSON.stringify(pv) === JSON.stringify(v)
            )
          ) {
            changedValues.push(v);
          }
        }
      }
      setLastValue(changedValues);
      setSelectedFilterValues((prevValues) => ({
        ...prevValues,
        [filter]: filterFirstSubArray(value),
      }));
    }
  };



  const handleProviderChange = useCallback(
    (value: number[], services2: Service[]) => {
      if (!value.length || value.flat()[value.flat().length - 1] === -1) {
        return services;
      }

      const providerIDs = new Set(value.flat());
      services2 = services2.filter(
        (x) => !!x.provider && providerIDs.has(x?.provider)
      );

      return services2;
    },
    []
  );

  const handleAccessibilityChange = useCallback(
    (value: number[], services: Service[]) => {
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
    (value: number[], services: Service[]) => {
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

  const handleServiceTypeChange = useCallback(
    (value: number[] | string[], services: Service[]) => {
      const categoryMap = new Map<number, boolean>();
      const subcategoryMap = new Map<number, boolean>();

      if (!value.length || value.flat()[value.flat().length - 1] === -1) {
        filterProviders(services);
        return services;
      }

      for (const criteria of value) {
        if (typeof criteria === "number") {
          categoryMap.set(criteria, true);
        } else {
          subcategoryMap.set(+criteria.split('-')[1], true);
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

      const categoryArray = Array.from(categoryMap);
      const subcategoryArray = Array.from(subcategoryMap);
      const cat = Object.values(app.data.categories.categories);
      const sub = Object.values(app.data.categories.subCategories);

      let testValue = null;
      if (lastValue?.length && lastValue.length === 1) {
        for (let category of categoryArray) {
          testValue = cat.find((x) => x.id === category[0])?.name["en-US"];
        }
      } else if (lastValue?.length && lastValue.length > 1) {
        for (let subcat of subcategoryArray) {
          testValue = sub.find((x) => x.id === subcat[0])?.name["en-US"];
        }
      }

      if (!!testValue) {
        ReactGA.event("dropdownChanged", {
          category: "TreeSelect",
          action: "Service Type Change",
          label: testValue,
          fieldValue: testValue,
        });
      }

      return services;
    },
    [lastValue]
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
        value.length &&
        value[0] !== -1
      ) {
        filteredData = handleProviderChange(value, filteredData);
      } else if (
        key === filterType.accessibility &&
        value.length &&
        value[0] !== -1
      ) {
        filteredData = handleAccessibilityChange(value, filteredData);
      } else if (
        key === filterType.populations &&
        value.length &&
        value[0] !== -1
      ) {
        filteredData = handlePopulationsChange(value, filteredData);
      } else if (
        key === filterType.serviceTypes &&
        value.length &&
        value[0] !== -1
      ) {
        filteredData = handleServiceTypeChange(value, filteredData);
      }
    });

    setState({ filteredServices: filteredData });
  }, [selectedFilterValues, app.data.services]);

  useEffect(() => {
    setState({
      filteredServices: services,
    });
  }, [app.data.services, app.data.categories.providers]);

  return (
    <div className="transition-all md:py-16 w-full flex items-center md:justify-center">
      <div className="sm:w-full px-4 md:w-2/3 w-screen">
        <div className="text-4xl">{translate(props.block.title)}</div>
        <div className="text-2xl mt-4 opacity-50">
          {translate(props.block.subtitle)}
        </div>
        {servicesLoaded &&
          <div className="flex flex-col md:flex-row gap-10">
            {filterOpen && (
              <div className="fixed inset-0 bg-white z-50 flex flex-col p-5 overflow-auto">
                <div className="flex ml-auto mb-5">
                  <Button onClick={() => setFilterOpen(false)} icon={<CloseOutlined />} />
                </div>
                <div className="flex flex-col md:flex-row gap-10 flex-grow">
                  <div className="md:flex flex-col flex-1">
                    <h2>Filters</h2>
                    <TreeSelect
                      label="Service Types"
                      items={combineCategoriesWithSubcategories(categories, subcategories)}
                      className="w-full overflow-hidden service-types-select"
                      onChange={(value) => handleSelectedFilters(value, filterType.serviceTypes)}
                      onClear={() => filterProviders(services)}
                      onDropdownVisibleChange={handleDropdownVisibleChange}
                      value={selectedFilterValues.serviceTypes}
                      defaultValue={[-1]}
                    />
                    <TreeSelect
                      label="Provider"
                      items={mapProviderData(state.filteredProviders)}
                      className="w-full overflow-hidden"
                      onChange={(value) => handleSelectedFilters(value, filterType.provider)}
                      value={selectedFilterValues.provider}
                      defaultValue={[-1]}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="hidden md:flex flex-col flex-1">
              <h2>Filters</h2>
              <TreeSelect
                label="Service Types"
                items={combineCategoriesWithSubcategories(categories, subcategories)}
                className="w-full overflow-hidden service-types-select"
                onChange={(value) => handleSelectedFilters(value, filterType.serviceTypes)}
                onClear={() => filterProviders(services)}
                onDropdownVisibleChange={handleDropdownVisibleChange}
                value={selectedFilterValues.serviceTypes}
                defaultValue={[-1]}
              />
              <TreeSelect
                label="Provider"
                items={mapProviderData(state.filteredProviders)}
                className="w-full overflow-hidden"
                onChange={(value) => handleSelectedFilters(value, filterType.provider)}
                value={selectedFilterValues.provider}
                defaultValue={[-1]}
              />
            </div>
            <div className="grow-[3] flex-1 relative">
              <div className="flex mt-3.5 mb-3.5">
                <Button icon={<FilterOutlined />} onClick={() => setFilterOpen(true)} className="md:hidden">Filters</Button>
                <Space className="flex ml-auto">
                  <Radio.Group value={view} onChange={(e) => setView(e.target.value)} className="flex">
                    <Radio.Button value={0}>
                      <div className="flex gap-2 items-center">
                        <span className="material-symbols-outlined material-icons">
                          map
                        </span>
                        Map
                      </div>
                    </Radio.Button>
                    <Radio.Button value={1}>
                      <div className="flex gap-2 items-center">
                        <span className="material-symbols-outlined material-icons">
                          list_alt
                        </span>
                        List
                      </div>
                    </Radio.Button>
                  </Radio.Group>
                </Space>
              </div>
              <div>
                {view === 0 && <Maps services={state.filteredServices} />}
                {view === 1 && <ServicesList services={state.filteredServices} />}
              </div>
            </div>
          </div>}
        {!servicesLoaded && (
          <div className="flex items-center justify-center my-16">
            <Loader size={72} width={12} className="bg-gray-500" />
          </div>
        )
        }
      </div>
    </div >
  );
}
