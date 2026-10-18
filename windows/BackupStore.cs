using System.IO;
using System.Text;
using System.Security.Cryptography;
using Microsoft.Data.Sqlite;
namespace GymOS.Windows;
public static class BackupStore {
 public static void Initialize(string path){Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);using var c=Open(path);using var cmd=c.CreateCommand();cmd.CommandText="CREATE TABLE IF NOT EXISTS snapshots(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant TEXT NOT NULL,created_at TEXT NOT NULL,payload BLOB NOT NULL)";cmd.ExecuteNonQuery();}
 static SqliteConnection Open(string path){var c=new SqliteConnection(new SqliteConnectionStringBuilder{DataSource=path,Mode=SqliteOpenMode.ReadWriteCreate}.ToString());c.Open();return c;}
 public static void Save(string path,string tenant,string json){Initialize(path);var encrypted=ProtectedData.Protect(Encoding.UTF8.GetBytes(json),null,DataProtectionScope.CurrentUser);using var c=Open(path);using var tx=c.BeginTransaction();using var cmd=c.CreateCommand();cmd.Transaction=tx;cmd.CommandText="INSERT INTO snapshots(tenant,created_at,payload) VALUES($tenant,$at,$payload)";cmd.Parameters.AddWithValue("$tenant",tenant);cmd.Parameters.AddWithValue("$at",DateTime.UtcNow.ToString("O"));cmd.Parameters.AddWithValue("$payload",encrypted);cmd.ExecuteNonQuery();tx.Commit();}
 public static string Latest(string path,string tenant){using var c=Open(path);using var cmd=c.CreateCommand();cmd.CommandText="SELECT payload FROM snapshots WHERE tenant=$tenant ORDER BY id DESC LIMIT 1";cmd.Parameters.AddWithValue("$tenant",tenant);var bytes=cmd.ExecuteScalar() as byte[]??throw new InvalidOperationException("No local snapshot for this account / لا توجد نسخة لهذا الحساب");return Encoding.UTF8.GetString(ProtectedData.Unprotect(bytes,null,DataProtectionScope.CurrentUser));}
}
