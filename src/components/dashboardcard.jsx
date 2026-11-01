function DashboardCard({ title, value }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "12px",
        width: "250px",
        minHeight: "120px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          margin: 0,
          textAlign: "center",
        }}
      >
        {title}
      </h3>

      <h1
        style={{
          textAlign: "center",
          marginTop: "25px",
        }}
      >
        {value}
      </h1>
    </div>
  );
}

export default DashboardCard;