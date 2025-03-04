import mermaid from "mermaid";
import { useRef, useEffect } from "react";


export function Mermaid({src, className}) {
    const ref = useRef(null);

    useEffect(() => {
        if (src) {
            mermaid.run({
                nodes: [ref.current],
              });            
        }
    }, [ref.current, src])

    return (
        src ?
        <div className={className} ref={ref} key={src}>
            {src}
        </div>
        : <div className={className} key={src} />
    );
}
