using Microsoft.Data.SqlClient;

namespace SiriusBackend
{
    public class TurbinaDAL
    {
        private readonly List<DatiTurbina> _ElencoDati = new List<DatiTurbina>();

        public List<DatiTurbina> GetAll()
        {
            // recupera i dati dal DB



            // mi connetto al DB
            using (SqlConnection connection = new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DBSirius;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"))
            {
                connection.Open();

                string sql = "SELECT Data, ActivePower FROM dbo.Energia WHERE ActivePower IS NOT NULL";
                using (SqlCommand command = new SqlCommand(sql, connection))
                {
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        _ElencoDati.Clear();
                        while (reader.Read())
                        {
                            DatiTurbina dato = new DatiTurbina();
                            dato.Data = reader.GetDateTime(0);
                            dato.ActivePower = reader.GetDecimal(1);
                            _ElencoDati.Add(dato);
                        }
                    }
                }
            }

            return _ElencoDati;
        }
    }
}
