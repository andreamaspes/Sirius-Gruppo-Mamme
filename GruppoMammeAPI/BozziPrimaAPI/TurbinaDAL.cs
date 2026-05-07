using Microsoft.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Formats.Asn1;

namespace BozziPrimaAPI
{
    public class TurbinaDAL
    {
        private List<Turbina> _ElencoTurbina = new List<Turbina>();

        public List<Turbina> GetAll()
        {//recupera tutti i dati dalla tabella TBTurbina e li restituisce come lista di oggetti Turbina

            //adesso mi collego con il db
            using (SqlConnection connection = new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DBSirius;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"))
            {
                connection.Open();

                string sql = "SELECT Power, Date FROM dbo.Energia WHERE ActivePower IS NOT NULL";

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
            using (var reader = new StreamReader(filePath))
            {
                // Salta l'intestazione se presente
                string? headerLine = reader.ReadLine();

                using (SqlConnection connection = new SqlConnection("Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=DBSirius;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"))
                {
                    connection.Open();

                    string? line;
                    while ((line = reader.ReadLine()) != null)
                    {
                        var values = line.Split(',');

                        // Adatta gli indici se necessario in base all'ordine delle colonne nel CSV
                        decimal power = decimal.Parse(values[0], CultureInfo.InvariantCulture);
                        DateTime date = DateTime.Parse(values[1], CultureInfo.InvariantCulture);

                        var cmd = new SqlCommand("INSERT INTO TBTurbina (Power, Date) VALUES (@Power, @Date)", connection);
                        cmd.Parameters.AddWithValue("@Power", power);
                        cmd.Parameters.AddWithValue("@Date", date);
                        cmd.ExecuteNonQuery();
                    }
                }
            }
        }
    }
}
