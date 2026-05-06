using Microsoft.Data.SqlClient;

namespace BozziPrimaAPI
{
    public class TurbinaDAL
    {
        private List<Turbina> _ElencoTurbina = new List<Turbina>();

        public List<Turbina> GetAll()
        {
            using (SqlConnection connection = new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DBSirius;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"))
            {
                connection.Open();

                string sql = "SELECT Power, Date FROM TBTurbina ORDER BY Date";

                using (SqlCommand command = new SqlCommand(sql, connection))
                {
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        _ElencoTurbina.Clear();
                        while (reader.Read())
                        {
                            Turbina turbina = new Turbina();
                            turbina.Power = reader.GetDecimal(0);
                            turbina.Date = reader.GetDateTime(1);
                            _ElencoTurbina.Add(turbina);
                        }
                    }
                }
            }

            return _ElencoTurbina;
        }

        public void ImportCsv(string filePath)
        {
            using var reader = new StreamReader(filePath);
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            var records = csv.GetRecords<Turbina>().ToList();

            using (SqlConnection connection = new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DBSirius;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"))
            {
                connection.Open();
                foreach (var turbina in records)
                {
                    var cmd = new SqlCommand("INSERT INTO TBTurbina (Power, Date) VALUES (@Power, @Date)", connection);
                    cmd.Parameters.AddWithValue("@Power", turbina.Power);
                    cmd.Parameters.AddWithValue("@Date", turbina.Date);
                    cmd.ExecuteNonQuery();
                }
            }
        }
    }
}

