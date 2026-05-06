public void SaveWindData(List<WindData> windDataList)
{
    using (SqlConnection connection = new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DBSirius;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"))
    {
        connection.Open();
        foreach (var windData in windDataList)
        {
            var cmd = new SqlCommand(
                "IF NOT EXISTS (SELECT 1 FROM TBWindData WHERE Date = @Date) " +
                "INSERT INTO TBWindData (Date, WindSpeed) VALUES (@Date, @WindSpeed)", connection);
            cmd.Parameters.AddWithValue("@Date", windData.Date);
            cmd.Parameters.AddWithValue("@WindSpeed", windData.WindSpeed);
            cmd.ExecuteNonQuery();
        }
    }
}
using var transaction = connection.BeginTransaction();
// ... associa la transaction ai tuoi SqlCommand
transaction.Commit();
public List<TurbinaWindDTO> GetTurbinaWithWind()
{
    var result = new List<TurbinaWindDTO>();
    using (var connection = new SqlConnection(...))
    {
        connection.Open();
        var cmd = new SqlCommand(
            "SELECT t.Date, t.Power, w.WindSpeed " +
            "FROM TBTurbina t LEFT JOIN TBWindData w ON t.Date = w.Date " +
            "ORDER BY t.Date", connection);
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                result.Add(new TurbinaWindDTO
                {
                    Date = reader.GetDateTime(0),
                    Power = reader.GetDecimal(1),
                    WindSpeed = reader.IsDBNull(2) ? null : reader.GetDecimal(2)
                });
            }
        }
    }
    return result;
}
