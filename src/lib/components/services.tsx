import { Link } from "react-router-dom";
import { translate } from "../app";
import { Pagination, Select } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ServiceListProps {
  services: Service[];
}

const count = 10;

const html2text = document.createElement("div");
html2text.hidden = true;

export function ServicesList({ services }: ServiceListProps) {
  const orderedServices = services.sort((a, b) => {
    const labelA = translate(a.name).toUpperCase();
    const labelB = translate(b.name).toUpperCase();
    if (labelA < labelB) {
      return -1;
    }
    if (labelA > labelB) {
      return 1;
    }
    return 0;
  });
  const [filteredServices, setFilteredServices] =
    useState<Service[]>(orderedServices);
  const [servicesList, setServicesList] = useState<Service[]>(
    orderedServices.slice(0, 10)
  );

  const mapAutocompleteOptions = useMemo(() => {
    const linkedCities = new Set(services.map((service) => service.city));
    const linkedRegions = new Set(services.map((service) => service.region));

    const serviceNames = services.map((service) => {
      return {
        label: translate(service.name),
        value: `S${service.id}`,
      };
    });
    const regionNames = Array.from(linkedRegions).map((region) => {
      return {
        label: translate(region),
        value: `R${translate(region)}`,
      };
    });
    const cityNames = Array.from(linkedCities).map((city) => {
      return {
        label: translate(city),
        value: `C${translate(city)}`,
      };
    });

    const allOptions = [...serviceNames, ...regionNames, ...cityNames];

    return allOptions.sort((a, b) => {
      const labelA = a.label.toUpperCase();
      const labelB = b.label.toUpperCase();
      if (labelA < labelB) {
        return -1;
      }
      if (labelA > labelB) {
        return 1;
      }
      return 0;
    });
  }, [services]);

  const onSelect = useCallback(
    (data: { key: string; label: string; value: string }) => {
      if (data.value.charAt(0) === "S") {
        setFilteredServices(
          services.filter((x) => x.id === +data.value.substring(1))
        );
      } else if (data.value.charAt(0) === "R") {
        setFilteredServices(
          services.filter((x) => x.region === data.value.substring(1))
        );
      } else {
        setFilteredServices(
          services.filter((x) => x.city === data.value.substring(1))
        );
      }
    },
    [services]
  );

  const handlePageChange = (page: number, pageSize: number) => {
    setServicesList(
      filteredServices.slice(
        (page - 1) * pageSize,
        Math.min(services.length, page * pageSize)
      )
    );
  };

  useEffect(() => {
    setServicesList(filteredServices.slice(0, 10));
  }, [filteredServices]);

  useEffect(() => {
    setFilteredServices(services);
  }, [services]);

  return (
    <div>
      <Select
        className="w-full"
        options={mapAutocompleteOptions}
        placeholder="Search"
        onSelect={onSelect}
        listHeight={100}
        showSearch
        allowClear
        labelInValue={true}
        onClear={() => {
          setFilteredServices(services);
        }}
        filterOption={(inputValue, option) =>
          option && option.label
            ? option!.label
                .toString()
                .toUpperCase()
                .indexOf(inputValue.toUpperCase()) !== -1
            : false
        }
      />
      {servicesList.map((s) => (
        <Service key={s.id} service={s} />
      ))}
      <Pagination
        className="mt-8"
        size="small"
        onChange={handlePageChange}
        total={filteredServices.length}
        showSizeChanger={false}
      />
    </div>
  );
}

function Service(props: { service: Service }) {
  const { service: s } = props;

  html2text.innerHTML = translate(s.description);
  const description = `${html2text.textContent.substring(0, 200)}...`;

  return (
    <Link key={s.id} to={`/service/${s.id}`}>
      <div className="text-black mb-6 hover:text-blue-500 transition-all">
        <h2>{translate(s.name)}</h2>
        <div className="-mt-4 opacity-60">{description}</div>
        <div className="w-full border border-solid border-gray-300 mt-2"></div>
      </div>
    </Link>
  );
}
