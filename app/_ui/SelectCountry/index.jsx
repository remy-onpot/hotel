import { getCountries } from "@/app/_lib/services";
import CustomSelect from "@/app/_ui/CustomSelect";

// Let's imagine your colleague already built this component 😃

async function SelectCountry({ defaultCountry, name, id, className }) {
  const countries = await getCountries();
  const options = [
    { value: "", label: "Select country..." },
    ...(Array.isArray(countries) ? countries : []).map((country) => ({
      value: `${country.name}%${country.flag}`,
      label: country.name,
    })),
  ];

  return (
    <CustomSelect
      name={name}
      id={id}
      ariaLabel={id ? undefined : "Select nationality"}
      options={options}
      defaultValue={options.find((country) => country.label === defaultCountry)}
      className={className}
      placeholder="Select country..."
      required
    />
  );
}

export default SelectCountry;
