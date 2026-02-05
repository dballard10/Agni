import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DayCardHeaderProps {
  dayIndex: number;
  date: Date;
  onClick?: () => void;
  isCollapsed?: boolean;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function DayCardHeader({
  dayIndex,
  date,
  onClick,
}: DayCardHeaderProps) {
  const dayName = DAY_NAMES[dayIndex];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const formattedDate = `${month}/${day}`;
  const content = `${dayName} ${formattedDate}`;

  const markdownComponents = {
    p: ({ node, ...props }: any) => (
      <span className="font-semibold text-slate-200" {...props} />
    ),
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="font-semibold text-slate-200 hover:text-slate-100 focus:outline-none transition-colors"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </button>
    );
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
