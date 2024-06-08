import { Link as Link2 } from "react-router-dom";
import { translate } from "../app";
import { Pagination, Select, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GetIconForChannel, getContactDetailLink } from "./service";
import { RightOutlined } from "@ant-design/icons";

const { Text, Title, Link } = Typography
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
        className="w-full md:absolute top-3.5 md:w-7/12"
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
      <div className="md:grid grid-cols-2 gap-4 mt-4 mb-4 flex flex-col">
        {servicesList.map((s) => (
          <Service key={s.id} service={s} />
        ))}
      </div>
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
    <Link2 key={s.id} to={`/service/${s.id}`} className="no-underline flex items-center h-full flex-grow border-2 border-solid border-gray-300 px-5">
      <div className="flex flex-col text-black hover:text-blue-500 transition-all h-full justify-between mb-6">
        <div>
          <Title level={3}>{translate(s.name)}</Title>
          {s.address && <Text className="text-sm mb-2 flex items-center opacity-80">
            <span className="material-symbols-outlined material-icons">
              pin_drop
            </span>
            {s.address}
          </Text>}
        </div>
        <Text className="mt-4 opacity-80">{description}</Text>
        <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
          {s?.contactInfo?.map(info => {
            if (!info.contact_details) return null;

            const icon = <GetIconForChannel channel={info.channel} />;
            const contactDetail = getContactDetailLink({
              channel: info.channel,
              contactDetails: info.contact_details,
            });
            return (
              <div className="truncate flex items-center gap-2">
                <Text>{icon}</Text>
                <Link className="truncate text-black" >{contactDetail}</Link>
              </div>
            )
          })}
        </div>
        <Link className="flex justify-end">See more details {<RightOutlined />}</Link>
      </div>
    </Link2>
  );
}
