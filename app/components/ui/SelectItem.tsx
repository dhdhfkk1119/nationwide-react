"use client";

type SelectItemProps = {
  label: string;
  checked: boolean;
  onChange: () => void;
};

export default function SelectItem({
  label,
  checked,
  onChange,
}: SelectItemProps) {
  return (
    <label className="d-flex align-items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="fw-bold fs-5">{label}</span>
    </label>
  );
}
