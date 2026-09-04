type InputFilterProp = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value:string) => void
}

export default function InputFilter(prop: InputFilterProp) {
  return (
        <div className="filter">
          <span>{prop.label}</span>
          <input
            type="text" 
            placeholder={prop.placeholder}
            onChange={(e) => prop.onChange(e.target.value)}
          />
        </div>
  );
}

