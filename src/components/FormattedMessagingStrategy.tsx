export function FormattedMessagingStrategy({ content }: { content: string }) {
  // Helper function to parse text with bold formatting
  const parseBoldText = (text: string, keyPrefix: string = "") => {
    if (!text.includes("**")) {
      return text;
    }

    const parts = text.split("**");
    return parts.map((part, partIndex) =>
      partIndex % 2 === 1 ? (
        <strong
          key={`${keyPrefix}-bold-${partIndex}`}
          className="font-bold text-slate-900"
        >
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  const formatContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip separator lines (---)
      if (line.trim().match(/^-{3,}$/)) {
        i++;
        continue;
      }

      // Handle main headers (# Header) - MESSAGING STRATEGY with darker coral color
      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={`h1-${i}`}
            className="text-lg font-bold mt-8 mb-4 pb-2"
            style={{ color: "rgba(235, 150, 140, 255)" }}
          >
            {parseBoldText(line.replace("# ", ""), `h1-${i}`)}
          </h1>
        );
        i++;
        continue;
      }

      // Handle subheaders (## Header) - with circular number badges
      if (line.startsWith("## ")) {
        const headerText = line.replace("## ", "");
        // Check if it starts with a number (e.g., "1. CORE PROMISE")
        const numberMatch = headerText.match(/^(\d+)\.\s+(.+)$/);

        if (numberMatch) {
          const number = numberMatch[1];
          const title = numberMatch[2];

          elements.push(
            <h2 key={`h2-${i}`} className="flex items-center gap-3 mt-6 mb-3">
              <span
                className="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold"
                style={{ backgroundColor: "#689cf2" }}
              >
                {number}
              </span>
              <span className="text-base font-bold text-slate-900">
                {parseBoldText(title, `h2-${i}`)}
              </span>
            </h2>
          );
        } else {
          // Regular subheader without number
          elements.push(
            <h2
              key={`h2-${i}`}
              className="text-base font-bold text-slate-900 mt-6 mb-3"
            >
              {parseBoldText(headerText, `h2-${i}`)}
            </h2>
          );
        }
        i++;
        continue;
      }

      // Handle section headers (### Header)
      if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={`h3-${i}`}
            className="text-sm font-semibold text-slate-900 mt-4 mb-2"
          >
            {parseBoldText(line.replace("### ", ""), `h3-${i}`)}
          </h3>
        );
        i++;
        continue;
      }

      // Handle bullet points - group consecutive bullets into <ul>
      if (line.trim().startsWith("- ")) {
        const bulletItems: JSX.Element[] = [];
        let bulletIndex = 0;
        while (i < lines.length && lines[i].trim().startsWith("- ")) {
          const bulletText = lines[i].trim().replace("- ", "");
          bulletItems.push(
            <li
              key={bulletIndex}
              className="text-slate-700 mb-1 leading-relaxed"
            >
              {parseBoldText(bulletText, `bullet-${i}-${bulletIndex}`)}
            </li>
          );
          bulletIndex++;
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="list-disc ml-6 mb-2">
            {bulletItems}
          </ul>
        );
        continue;
      }

      // Handle numbered lists - group consecutive numbers into <ol>
      if (/^\d+\.\s/.test(line.trim())) {
        const numberedItems: JSX.Element[] = [];
        let numberedIndex = 0;
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          const numberedText = lines[i].trim().replace(/^\d+\.\s/, "");
          numberedItems.push(
            <li
              key={numberedIndex}
              className="text-slate-700 mb-1 leading-relaxed"
            >
              {parseBoldText(numberedText, `numbered-${i}-${numberedIndex}`)}
            </li>
          );
          numberedIndex++;
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="list-decimal ml-6 mb-2">
            {numberedItems}
          </ol>
        );
        continue;
      }

      // Handle empty lines
      if (line.trim() === "") {
        elements.push(<br key={`br-${i}`} />);
        i++;
        continue;
      }

      // Regular text (including bold)
      elements.push(
        <p key={`p-${i}`} className="text-slate-700 mb-2 leading-relaxed">
          {parseBoldText(line, `p-${i}`)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return <div className="space-y-1">{formatContent(content)}</div>;
}


