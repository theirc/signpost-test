import { app, translate } from "../app";
import { Loader } from "./loader";
import { languages } from "../locale"
import { Maps } from "./map";
import { Button, Radio, Space } from "antd";
import { ServicesList } from "./services";
import React, { useCallback, useEffect, useState } from "react";
import TreeSelect, { MenuItem } from "./tree-select";
import ReactGA from "react-ga4";
import { CloseOutlined, FilterOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { Blocks } from "./blocks";
import { translations } from "../../translations";
import { RadioChangeEvent } from "antd/lib";
import { Container } from "./container"

enum filterType {
  serviceTypes = "serviceTypes",
  provider = "provider",
  populations = "populations",
  accessibility = "accessibility",
}

type FilterValues = {
  serviceTypes: (string | number)[],
  provider: (string | number)[],
  populations: (string | number)[],
  accessibility: (string | number)[],
}

export function BlockServices(props: { block: BlockServices }) {
  const { block } = props
  const styles = Blocks.buildStyle(block)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  
  const isRTL = languages[app.locale]?.rtl;

  const {
    state: { servicesLoaded },
  } = app;
  const [selectedFilterValues, setSelectedFilterValues] = useState<FilterValues>({
    serviceTypes: [-1],
    provider: [-1],
    populations: [-1],
    accessibility: [-1],
  });
  const [lastValue, setLastValue] = useState<number[]>([-1]);
  const [view, setView] = useState<number>(0)

  const services = Object.values(app.data.services).filter(
    (x) => x.status !== "archived"
  )
  ReactGA.initialize("G-H6VQ1Y6EX9");

  const providers = Object.values(app.data.providers)

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

  const [filteredServices, setFilteredServices] = useState(services)
  const [filteredProviders, setFilteredProviders] = useState(providers)

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
    combinedData.unshift({ value: -1, label: translate(translations.allServiceTypes) });
    return combinedData;
  };


  const mapProviderData = (providers: Provider[]): MenuItem[] => {
    const filterProviders = providers.map((x) => {
      return {
        value: x.id,
        label: translate(x.name),
      };
    });
    filterProviders.unshift({ value: -1, label: translate(translations.allProviders) });
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
      searchParams.delete(filter)
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
      searchParams.delete(filter)

      filterFirstSubArray(value).forEach(x => {
        searchParams.append(filter, x.toString())
      })
    }
    setSearchParams(new URLSearchParams(searchParams))
  };



  const handleProviderChange = useCallback(
    (value: number[] | (string | number)[], services2: Service[]) => {
      if (!value.length || value.flat()[value.flat().length - 1] === -1) {
        return services;
      }

      const providerIDs = new Set(value.flat());
      services2 = services2.filter(
        (x) => !!x.provider && providerIDs.has(x?.provider)
      );

      return services2;
    },
    [lastValue]
  );

  const handleAccessibilityChange = useCallback(
    (value: number[] | (string | number)[], services: Service[]) => {
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
    (value: number[] | (string | number)[], services: Service[]) => {
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
    (value: number[] | (string | number)[], services: Service[]) => {
      const categoryMap = new Map<number, boolean>();
      const subcategoryMap = new Map<number, boolean>();

      if (!value.length || value.flat()[value.flat().length - 1] === -1) {
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
  )

  useEffect(() => {
    let filteredData = [...services]

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

    setFilteredServices(filteredData)
  }, [selectedFilterValues, app.data.services, servicesLoaded]);

  useEffect(() => {
    const uniqueProvidersSet = new Set(services.flatMap((x) => x.provider))
    const providers = Object.values(app.data.providers).filter((x) => Array.from(uniqueProvidersSet).includes(x.id))
      .sort((a, b) =>
        translate(a.name)
          .normalize().toLowerCase()
          .localeCompare(translate(b.name).normalize().toLowerCase())
      )
    setFilteredProviders(providers)
    setFilteredServices(services)
  }, [app.data.services, servicesLoaded, app.data.providers])

  useEffect(() => {
    const categoriesParams = searchParams.getAll('serviceTypes')
    const paramsCategories = categoriesParams.map(cat => {
      if (cat.indexOf('-') !== -1) {
        return cat;
      } else {
        return +cat;
      }
    })
    const providersParams = searchParams.getAll('provider').map(provider => {
      return +provider
    })
    const populationsParams = searchParams.getAll('populations')
    const accessibilityParams = searchParams.getAll('accessibility')

    if (categoriesParams.length || providersParams.length || populationsParams.length || accessibilityParams.length) {
      const element = document.getElementById('service-map')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }

    const mapView = searchParams.get('view')

    if (mapView) setView(+mapView)

    setSelectedFilterValues({
      serviceTypes: paramsCategories.length ? paramsCategories : [-1],
      provider: providersParams.length ? providersParams : [-1],
      populations: populationsParams.length ? populationsParams : [-1],
      accessibility: accessibilityParams.length ? accessibilityParams : [-1],
    });
  }, [servicesLoaded]);

  const handleViewChange = (e: RadioChangeEvent) => {
    const value = e.target.value
    searchParams.delete('view')
    searchParams.append('view', value)
    setSearchParams(new URLSearchParams(searchParams))
    setView(value)
  }

  return (
    <Container block={block} className={`relative transition-all service-container  ${isRTL ? 'rtl' : ''}`}>
      <div className={`text-4xl ${isRTL ? 'text-right' : 'text-left'}`}>{translate(props.block.title)}</div>
      <div className={`text-2xl mt-4 opacity-50 ${isRTL ? 'text-right' : 'text-left'}`}>{translate(props.block.subtitle)}</div>
        {servicesLoaded &&
          <div className="flex flex-col md:flex-row gap-10">
            {filterOpen && (
              <div className="fixed inset-0 bg-white z-50 flex flex-col p-5 overflow-auto">
                <div className="flex ml-auto mb-5">
                  <Button onClick={() => setFilterOpen(false)} icon={<CloseOutlined />} />
                </div>
                <div className="flex flex-col md:flex-row gap-10 flex-grow">
                  <div className="md:flex flex-col flex-1">
                    <h2>{translate(translations.filters)}</h2>
                    <TreeSelect
                      label={translate(translations.service_types)}
                      items={combineCategoriesWithSubcategories(categories, subcategories)}
                      className="w-full overflow-hidden service-types-select"
                      onChange={(value) => handleSelectedFilters(value, filterType.serviceTypes)}
                      value={selectedFilterValues.serviceTypes}
                      defaultValue={[-1]}
                    />
                    <TreeSelect
                      label={translate(translations.provider)}
                      items={mapProviderData(filteredProviders)}
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
              <h2>{translate(translations.filters)}</h2>
              <TreeSelect
                label={translate(translations.serviceTypes)}
                items={combineCategoriesWithSubcategories(categories, subcategories)}
                className="w-full overflow-hidden service-types-select"
                onChange={(value) => handleSelectedFilters(value, filterType.serviceTypes)}
                value={selectedFilterValues.serviceTypes}
                defaultValue={[-1]}
              />
              <TreeSelect
                label={translate(translations.provider)}
                items={mapProviderData(filteredProviders)}
                className="w-full overflow-hidden"
                onChange={(value) => handleSelectedFilters(value, filterType.provider)}
                value={selectedFilterValues.provider}
                defaultValue={[-1]}
              />
            </div>
            <div className="grow-[4] flex-1 relative">
              <div className="flex mt-3.5 mb-3.5 items-center">
                <Button icon={<FilterOutlined />} onClick={() => setFilterOpen(true)} className="md:hidden bg-[#FAE264]">{translate(translations.filters)}</Button>
                {view === 0 && <span className="hidden md:inline">{translate(translations.showing)} {filteredServices.length} {translate(translations.of)} {services.length} </span>}
                <Space className={`flex ${isRTL ? 'mr-auto' : 'ml-auto'} z-10`}>
                  <Radio.Group value={view} onChange={handleViewChange} className={`flex map-buttons-container ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Radio.Button value={0} className={isRTL ? 'button-reverse' : ''}>
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 ${isRTL ? 'content-normalize' : ''}`}>
                        <span className="material-symbols-outlined material-icons">
                          map
                        </span>
                        {translate(translations.map)}
                      </div>
                    </Radio.Button>
                    <Radio.Button value={1} className={isRTL ? 'button-reverse' : ''}>
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 ${isRTL ? 'content-normalize' : ''}`}>
                        <span className="material-symbols-outlined material-icons">
                          list_alt
                        </span>
                        {translate(translations.list)}
                      </div>
                    </Radio.Button>
                  </Radio.Group>
                </Space>
              </div>

              {view === 0 && <div className="md:hidden my-4">{translate(translations.showing)} {filteredServices.length} of {services.length} </div>}
              <div>
                {view === 0 && <Maps services={filteredServices} />}
                {view === 1 && <ServicesList serviceCount={services?.length} services={filteredServices} />}
              </div>
          </div>
        </div>}
      {!servicesLoaded && (
        <div className="flex items-center justify-center my-16">
          <Loader size={72} width={12} className="bg-gray-500" />
        </div>
      )}
  </Container>
);
}