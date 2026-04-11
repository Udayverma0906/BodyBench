type Props = {
  label: string;
  value?: number;
  onChange: (value: number | null) => void;
  error?: string;
};

function InputField({ label, value, onChange, error }: Props) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? null : Number(val));
        }}
        className={`w-full p-3 rounded-lg border outline-none transition
          ${error ? "border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:ring-2 focus:ring-blue-200"}
        `}
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default InputField;