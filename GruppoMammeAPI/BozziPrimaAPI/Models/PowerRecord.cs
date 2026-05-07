using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace BozziPrimaAPI.Models
{
    public class PowerRecord
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Name("Date")]
        public DateTime Date { get; set; }
        [Name("Power")]
    }
}
