export default function FormLabel({ children, required = false, optional = false }) {
  return (
    <label>
      {children}
      {required && <span className="required-star">*</span>}
      {optional && <span className="optional-text">(optional)</span>}
    </label>
  );
}