type SelectOption = {
  value: string;
  label: string;
};

type SelectFilterProp = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value:string) => void
}

export default function SelectFilter(prop: SelectFilterProp) {
  return (
        <div className="filter">
          <span>{prop.label}</span>
          <select
          value={prop.value}
          onChange={(e) => prop.onChange(e.target.value)}
          >
          {prop.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          </select>
        </div>
  );
}

