using Microsoft.Data.SqlClient;

namespace SiriusBackend
{
    public class VentoDAL
    {
        private readonly List<DatiVento> _ElencoDati = new List<DatiVento>();

        public List<DatiVento> GetAll()
        {
            // recupera i dati dal DB

            // mi connetto al DB
            using (SqlConnection connection = new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DBSirius;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"))
            {
                connection.Open();

                string sql = "SELECT Data, Windspeed FROM dbo.Vento WHERE Windspeed IS NOT NULL";
                using (SqlCommand command = new SqlCommand(sql, connection))
                {
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        _ElencoDati.Clear();
                        while (reader.Read())
                        {
                            DatiVento dato = new DatiVento();
                            dato.Data = reader.GetDateTime(0);
                            dato.Windspeed = reader.GetDecimal(1);
                            _ElencoDati.Add(dato);
                        }
                    }
                }
            }

            return _ElencoDati;
        }
    }
}
