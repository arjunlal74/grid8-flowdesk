import ReactApexChart from 'react-apexcharts';

export default function WeeklyHoursChart({ data = [], height = 220 }) {
  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.hours);
  const max = Math.max(...values, 8);

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true, speed: 350 },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        borderRadiusApplication: 'end',
        columnWidth: '45%',
        distributed: false,
      },
    },
    colors: ['var(--accent)'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        opacityFrom: 0.95,
        opacityTo: 0.55,
        stops: [0, 100],
      },
    },
    grid: {
      borderColor: 'rgba(127,127,127,0.12)',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: -8, right: 4, top: 0, bottom: 0 },
    },
    xaxis: {
      categories: labels,
      labels: { style: { colors: '#8a8a8a', fontSize: '11px', fontFamily: 'Inter' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      max: Math.ceil(max + 1),
      tickAmount: 4,
      forceNiceScale: true,
      labels: {
        style: { colors: '#8a8a8a', fontSize: '10.5px', fontFamily: 'Inter' },
        formatter: (v) => Math.max(0, Math.round(v)),
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (v) => `${v} h` },
      style: { fontSize: '11px', fontFamily: 'Inter' },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
  };

  const series = [{ name: 'Hours', data: values }];

  return <ReactApexChart options={options} series={series} type="bar" height={height} />;
}
