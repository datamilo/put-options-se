import { lazy, Suspense, CSSProperties } from 'react';

const Plot = lazy(() => import('react-plotly.js'));

interface PlotProps {
  style?: CSSProperties;
  [key: string]: any;
}

const PlotSkeleton = ({ style }: { style?: CSSProperties }) => (
  <div
    className="animate-pulse rounded-lg bg-muted/20"
    style={{
      width: style?.width ?? '100%',
      height: style?.height ?? 400,
    }}
  />
);

export const PlotWrapper = ({ style, ...rest }: PlotProps) => (
  <Suspense fallback={<PlotSkeleton style={style} />}>
    <Plot style={style} {...rest} />
  </Suspense>
);
