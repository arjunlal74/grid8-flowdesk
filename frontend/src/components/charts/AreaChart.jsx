import ReactApexChart from 'react-apexcharts';

export default function AreaChart({ data = [], height = 200 }) {
  const options = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      sparkline: { enabled: false },
      animations: { enabled: true, speed: 400 },
    },
    stroke: { curve: 'smooth', width: 1.5, colors: ['rgba(255,255,255,0.7)'] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        colorStops: [
          { offset: 0, color: '#FFFFFF', opacity: 0.12 },
          { offset: 100, color: '#FFFFFF', opacity: 0 },
        ],
      },
    },
    grid: {
      borderColor: '#222222',
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 0, right: 0, top: 0, bottom: 0 },
    },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#555555', fontSize: '10px', fontFamily: 'Inter' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: '#555555', fontSize: '10px', fontFamily: 'Inter' },
        formatter: (v) => Math.round(v),
      },
    },
    tooltip: {
      theme: 'dark',
      x: { format: 'MMM dd' },
      style: { fontSize: '11px', fontFamily: 'Inter' },
    },
    dataLabels: { enabled: false },
    markers: { size: 0 },
  };

  const series = [{
    name: 'Count',
    data: data.map(d => ({ x: new Date(d.date).getTime(), y: d.count })),
  }];

  return <ReactApexChart options={options} series={series} type="area" height={height} />;
}
