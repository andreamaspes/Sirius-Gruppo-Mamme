using Microsoft.Data.SqlClient;

namespace BozziPrimaAPI
{
    public class VentoDAL
    {
        private List<Vento> _ElencoVento = new List<Vento>();

        public List<Vento> GetAll()
        {
            // recupera i dati dal DB



            // mi connetto al DB
            using (SqlConnection connection = new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DBSirius;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"))
            {
                connection.Open();

                string sql = "SELECT movie_id,title FROM TBMovies";

                using (SqlCommand command = new SqlCommand(sql, connection))
                {
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        _ElencoVento.Clear();
                        while (reader.Read())
                        {
                            Vento vento = new Vento();
                            vento.WindSpeed = reader.GetDecimal(0);
                            _ElencoVento.Add(vento);
                        }
                    }
                }
            }

            return _ElencoVento;
        }
    }
}
