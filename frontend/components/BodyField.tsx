interface BodyFieldProps {
  html: string;
  className?: string;
}

export default function BodyField({ html, className = "" }: BodyFieldProps) {
  return (
    <div
      className={`prose prose-gray max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
