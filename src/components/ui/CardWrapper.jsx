export const CardWrapper = ({ children, title }) => (
  <div className="rounded-sm border border-border bg-card shadow-sm">
    {title && (
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-white">
          {title}
        </h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);
